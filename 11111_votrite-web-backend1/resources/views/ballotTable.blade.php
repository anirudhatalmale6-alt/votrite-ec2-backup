<table class="table table-striped table-bordered table-hover" id="ballot_table">
    <thead>
        <tr>
            <th class="table-checkbox">
                <input type="checkbox" class="form-control group-checkable changed_sel" style="margin-left: 5px; margin-right: 5px;" data-set="#ballot_table .checkboxes"/>
            </th>
            <th class="table-no">
                No
            </th>
            <th>
                Ballot
            </th>
            <th>
                Client
            </th>
            <th>
                Address
            </th>
            <th>
                Status
            </th>
            <th>
                Actions
            </th>
            <th>
                Print
            </th>
        </tr>
    </thead>
    <tbody>
        @if(empty($ballots->data))
        @else
        @foreach($ballots->data as $ballot)
        <tr class="odd gradeX">
            <td>
                <input type="checkbox" class="form-control checkboxes changed_sel" style="margin-left: 5px; margin-right: 5px;" data-id="{{ $ballot->ballot_id }}"/>
            </td>
            <td>
            {{ $loop->index+1 }}
            </td>
            <td id="election">
                {{ $ballot->election }}
            </td>
            <td>
                {{ $ballot->client }}
            </td>
            <td>
                {{ $ballot->address }}
            </td>
            <td>
            @if(date("Y-m-d h:i:sa", strtotime($ballot->end_date)) < date("Y-m-d h:i:sa"))
                <!-- <input type="checkbox" name="active_ballot_checkbox" data-id="{{ $ballot->ballot_id }}"> -->
                Inactive
            @else
                <!-- <input type="checkbox" checked="checked" name="active_ballot_checkbox" data-id="{{ $ballot->ballot_id }}"> -->
                Active
            @endif
            </td>
            <td>
                <a class="previewBallotModal" data-id="{{ $ballot->ballot_id }}" data-election="{{ $ballot->election }}" data-client="{{ $ballot->client }}" data-address="{{ $ballot->address }}" data-board="{{ $ballot->board }}" data-start="{{ $ballot->start_date }}" data-end="{{ $ballot->end_date }}" data-toggle="modal"><i class="fa fa-eye" data-toggle="tooltip" title="Preview"></i></a>
                <a class="editBallotModal" data-id="{{ $ballot->ballot_id }}" data-election="{{ $ballot->election }}" data-client="{{ $ballot->client }}" data-address="{{ $ballot->address }}" data-board="{{ $ballot->board }}" data-start="{{ $ballot->start_date }}" data-end="{{ $ballot->end_date }}" data-toggle="modal"><i class="fa fa-edit" data-toggle="tooltip" title="Edit"></i></a>
                <a class="deleteBallotModal" data-id="{{ $ballot->ballot_id }}" data-toggle="modal"><i class="fa fa-trash-o" data-toggle="tooltip" title="Delete"></i></a>
            </td>
            <td>
                <a class="printBallot" data-id="{{ $ballot->ballot_id }}"><i class="fa fa-print" data-toggle="tooltip" title="Print"></i></a>
            </td>
        </tr>
        @endforeach
        @endif
    </tbody>
</table>
